

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const db = require('./database');

// Cấu hình
const APP_PORT = process.env.PORT || 3000;
const ADMIN_ID = process.env.ADMIN_ID || "1323896339888738318";
const AUTO_CLEAN_CHANNEL = process.env.AUTO_CLEAN_CHANNEL || "1479662254587777044";

process.on("unhandledRejection", (r) => console.error('unhandledRejection', r));
process.on("uncaughtException", (err) => console.error('uncaughtException', err));
// --- web server 
const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/api/reward', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Thiếu mã xác thực!' });

    db.get("SELECT * FROM sessions WHERE token = ?", [token], (err, session) => {
      if (err) {
        console.error('DB sessions get error:', err);
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      if (!session) return res.status(404).json({ success: false, message: 'Mã không tồn tại!' });
      if (session.status === 'completed') return res.status(403).json({ success: false, message: 'Mã này đã được sử dụng rồi!' });

      const userid = session.userid;
      db.run("UPDATE sessions SET status = ? WHERE token = ?", ['completed', token]);

      const rewardAmount = 150;
      db.get("SELECT coins FROM users WHERE id = ?", [userid], (err2, userRow) => {
        if (err2) console.error('DB users get err:', err2);

        const currentCoins = userRow ? (userRow.coins || 0) : 0;
        const newTotal = currentCoins + rewardAmount;

        if (userRow) {
          db.run("UPDATE users SET coins = coins + ? WHERE id = ?", [rewardAmount, userid]);
        } else {
          db.run("INSERT INTO users (id, coins) VALUES (?, ?)", [userid, rewardAmount]);
        }

        db.get("SELECT * FROM users WHERE id = ?", [userid], async (err3, updatedUser) => {
          if (err3) console.error('DB users get after update err:', err3);
          const daily = updatedUser?.daily_links || 0;
          const total = updatedUser?.completed_links || 0;
          const coins = updatedUser?.coins || newTotal;
          await syncCoinToWeb(userid, coins);

  
          try {
            if (client && client.readyAt) {
              const u = await client.users.fetch(userid).catch(() => null);
              if (u) {
                const embed = new EmbedBuilder()
                  .setTitle('🎁 PHẦN THƯỞNG ĐÃ VỀ')
                  .setDescription('Bạn vừa hoàn thành nhiệm vụ vượt link!')
                  .addFields(
                    { name: '💰 Coin nhận', value: `+${rewardAmount}`, inline: true },
                    { name: '💳 Số dư', value: `${coins} coin`, inline: true },
                    { name: '🔗 Hôm nay', value: `${daily}/3 lần`, inline: true },
                    { name: '📊 Tổng vượt', value: `${total} lần`, inline: true }
                  )
                  .setColor('#00FF7F')
                  .setFooter({ text: 'Cảm ơn bạn đã ủng hộ!' });

                await u.send({ embeds: [embed] }).catch(() => {
                });
              }
            }
          } catch (e) {
            console.error('error sending reward DM:', e);
          }

          return res.json({ success: true, total: coins });
        });
      });

    });
  } catch (e) {
    console.error('/api/reward error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

app.listen(APP_PORT, () => console.log(`🌍 Web Server: http://localhost:${APP_PORT}`));

// --- Discord Bot ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message]
});

// Load command dis
client.commands = new Map();
try {
  if (fs.existsSync('./commands')) {
    const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const cmd = require(`./commands/${file}`);
        if (cmd && cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
      } catch (e) {
        console.error('load command error', file, e);
      }
    }
  }
} catch (e) {
  console.error('commands load error', e);
}

// helper: doc user.js (fallback)
const userdataPath = path.join(__dirname, 'userdata.json');
function loadUserdata() {
  if (!fs.existsSync(userdataPath)) return {};
  try { return JSON.parse(fs.readFileSync(userdataPath, 'utf8')); } catch { return {}; }
}
function saveUserdata(data) {
  fs.writeFileSync(userdataPath, JSON.stringify(data, null, 2));
}

client.once('ready', async () => {
    console.log(`🤖 Bot ${client.user.tag} đã sẵn sàng!`);
    const commandsArray = Array.from(client.commands.values()).map(c => c.data.toJSON());
    try {
        await client.application.commands.set(commandsArray);
    } catch (e) {
        console.error('Lỗi đăng command:', e);
    }

    console.log(`🤖 ${client.user.tag} đã online`);

    const CHANNEL_ID = "1479662254587777044";

    setInterval(async () => {

        const channel = client.channels.cache.get(CHANNEL_ID);
        if (!channel) return;

        try {
            const messages = await channel.messages.fetch({ limit: 100 });

            const toDelete = messages.filter(msg =>
                !msg.pinned && !msg.system
            );

            if (toDelete.size > 0) {
                try {
                    await channel.bulkDelete(toDelete, true);
                    console.log(`🧹 Đã xoá ${toDelete.size} tin nhắn`);
                } catch (err) {
                    console.warn('bulkDelete lỗi (bỏ qua):', err.message || err);
                    for (const m of toDelete.values()) {
                        try { await m.delete().catch(()=>{}); } catch {}
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi fetch messages để xoá:', err);
        }

    }, 15000000);
});
// DISCORD API YUM

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!checkcoin' || message.content === '!bal') {
        // Lấy số dư từ database SQLite của bạn
        db.get("SELECT coins FROM users WHERE id = ?", [message.author.id], async (err, row) => {
            if (err) {
                console.error('Lỗi lấy số dư:', err);
                return message.reply('❌ Có lỗi xảy ra khi kiểm tra số dư.');
            }

            const userBalance = row ? (row.coins || 0) : 0;

            // TỰ ĐỘNG GỌI SYNC LÊN WEB
            await syncCoinToWeb(message.author.id, userBalance);

            // Phản hồi người dùng
            message.reply(`💰 Số dư của bạn: **${userBalance.toLocaleString()} Coin**\n🔄 *Dữ liệu đã được tự động đồng bộ lên Website!*`);
        });
    }
});

// staff
const staffState = new Map();

// Rank
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === 'buy_rankbaby') {
        await interaction.deferReply({ flags: 64 });
        const price = 500;
        const roleId = process.env.ROLE_RANKBABY || "1479822493475930264";
        db.get("SELECT coins FROM users WHERE id = ?", [interaction.user.id], async (err, user) => {
          if (err) console.error('DB err', err);
          if (!user || (user.coins || 0) < price) {
            return interaction.editReply({ content: "❌ Bạn không đủ coin!", flags: 64 });
          }
          const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
          if (!member) return interaction.editReply({ content: "Không tìm thấy member.", flags: 64 });
          if (member.roles.cache.has(roleId)) return interaction.editReply({ content: "Bạn đã có rank này rồi!", flags: 64 });

          db.run("UPDATE users SET coins = coins - ? WHERE id = ?", [price, interaction.user.id]);

          try {
            await member.roles.add(roleId);
          } catch (err) {
            console.error('Add role error:', err);
            return interaction.editReply({ content: "Bot không thể cấp role (kiểm tra quyền/role position).", flags: 64 });
          }

          return interaction.editReply({ content: "✅ Bạn đã mua thành công!", flags: 64 });
        });
        return;
      }

   
      return interaction.reply({ content: 'Đã nhận tương tác.', flags: 64 });
    } 


    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (e) {
        console.error('Command execution error:', e);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'Lỗi thực thi lệnh!', flags: 64 });
        } else {
          try { await interaction.editReply({ content: 'Lỗi thực thi lệnh!' }); } catch {}
        }
      }
    }

  } catch (err) {
    console.error('Unhandled interaction error:', err);
    try {
      if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: 'Có lỗi xảy ra.', flags: 64 });
    } catch {}
  }
});

// thu ky lo
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

   
    if (message.author.id === ADMIN_ID) {
      const raw = message.content ? message.content.toLowerCase().trim() : '';

   
      if (raw === 'tha tội' || raw === 'tha toi') {
        staffState.delete(message.author.id);
        await message.reply('Đã hủy lệnh rồi sếp.');
        return;
      }


      if (raw === 'thư ký' || raw === 'thu ky' || raw === 'thư ký kick') {
        staffState.set(message.author.id, { step: 1 });
        await message.reply('Có anh muốn sử dụng như nào?\n\n1 kick\n2 ban\n3 mute');
        return;
      }


      if (staffState.has(message.author.id)) {
        const data = staffState.get(message.author.id);
        if (data.step === 1) {
          if (raw === '1' || raw === '2' || raw === '3') {
            data.action = raw === '1' ? 'kick' : raw === '2' ? 'ban' : 'mute';
            data.step = 2;
            staffState.set(message.author.id, data);
            await message.reply('Cho em tên (mention) em sẽ cho sếp một kết quả.');
            return;
          } else {
            await message.reply('Chọn 1 / 2 / 3.');
            return;
          }
        } else if (data.step === 2) {
          const member = message.mentions.members.first();
          if (!member) return message.reply('Hãy mention người cần thao tác.');
          try {
            if (data.action === 'kick') {
              if (!member.kickable) return message.reply('Không thể kick người này (quyền hoặc role cao hơn).');
              await member.kick(`Yêu cầu của ${message.author.tag}`);
              await message.channel.send('Đã kick theo yêu cầu.');
            } else if (data.action === 'ban') {
              if (!message.guild.members.me.permissions.has('BanMembers')) {
                return message.reply('Bot không có quyền ban (Ban Members).');
              }
              await member.ban({ reason: `Yêu cầu của ${message.author.tag}` });
              await message.channel.send('Đã ban theo yêu cầu.');
            } else if (data.action === 'mute') {
              const muteRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
              if (!muteRole) return message.reply('Server chưa có role "Muted".');
              if (!member.manageable) return message.reply('Không thể thêm role cho người này.');
              await member.roles.add(muteRole);
              await message.channel.send('Đã mute theo yêu cầu.');
            }
          } catch (err) {
            console.error('Staff action error:', err);
            await message.reply('Không thể thực hiện thao tác (lỗi).');
          } finally {
            staffState.delete(message.author.id);
          }
          return;
        }
      }
    }
  } catch (err) {
    console.error('messageCreate error:', err);
  }
});
// Discord API (2)

async function syncCoinToWeb(discordId, newBalance) {
    try {
        // Lưu ý: Nếu dùng Node.js cũ (dưới v18), bạn cần cài thêm node-fetch
        await fetch('https://ais-dev-hskp5lj3ntf4i5nwsnpilo-704014438670.asia-southeast1.run.app/api/bot/sync-coin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: "yumii-bank", // <--- Phải khớp với BOT_API_KEY trên Web
                discord_id: discordId,
                coin_balance: newBalance
            })
        });
        console.log(`[Sync] Đã đồng bộ ${newBalance} coin cho ${discordId}`);
    } catch (e) {
        console.error("Lỗi đồng bộ web:", e.message);
    }
}


client.login(process.env.DISCORD_TOKEN);