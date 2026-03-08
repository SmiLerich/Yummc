const {
Client,
GatewayIntentBits,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
ModalBuilder,
TextInputBuilder,
TextInputStyle,
EmbedBuilder
} = require("discord.js")

const db = require("./database")

const client = new Client({
intents:[GatewayIntentBits.Guilds]
})

const TOKEN = process.env.TOKEN
const ADMIN_CHANNEL = process.env.ADMIN_CHANNEL
const QR_IMAGE = process.env.QR_IMAGE

client.once("ready",()=>{

console.log("Bank bot online")

})

client.on("interactionCreate", async interaction=>{

if(interaction.isChatInputCommand()){

if(interaction.commandName === "bank"){

const user = db.getUser(interaction.user.id)

if(!user){

const modal = new ModalBuilder()
.setCustomId("create_account")
.setTitle("Mở tài khoản")

const name = new TextInputBuilder()
.setCustomId("username")
.setLabel("Tên tài khoản")
.setStyle(TextInputStyle.Short)

const pass = new TextInputBuilder()
.setCustomId("password")
.setLabel("Mật khẩu")
.setStyle(TextInputStyle.Short)

modal.addComponents(
new ActionRowBuilder().addComponents(name),
new ActionRowBuilder().addComponents(pass)
)

return interaction.showModal(modal)

}

const embed = new EmbedBuilder()

.setTitle("🏦 YUMMC BANK")

.setDescription(`
👤 Chủ TK: **${user.username}**
💰 Số dư: **${user.money} VND**
`)

.setColor("Green")

const row = new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId("deposit")
.setLabel("💰 Nạp tiền")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("top")
.setLabel("📊 Top")
.setStyle(ButtonStyle.Secondary),

new ButtonBuilder()
.setCustomId("transfer")
.setLabel("🔄 Chuyển tiền")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("history")
.setLabel("📜 Lịch sử")
.setStyle(ButtonStyle.Secondary)

)

interaction.reply({
embeds:[embed],
components:[row],
ephemeral:true
})

}

}

if(interaction.isButton()){

if(interaction.customId === "deposit"){

const row = new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId("deposit_card")
.setLabel("📱 Nạp Card")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("deposit_bank")
.setLabel("🏦 Nạp Bank")
.setStyle(ButtonStyle.Success)

)

interaction.reply({
content:"Chọn phương thức nạp",
components:[row],
ephemeral:true
})

}

if(interaction.customId === "deposit_card"){

const modal = new ModalBuilder()
.setCustomId("card_modal")
.setTitle("Nạp thẻ")

const type = new TextInputBuilder()
.setCustomId("type")
.setLabel("Loại thẻ")
.setStyle(TextInputStyle.Short)

const code = new TextInputBuilder()
.setCustomId("code")
.setLabel("Mã thẻ")
.setStyle(TextInputStyle.Short)

const serial = new TextInputBuilder()
.setCustomId("serial")
.setLabel("Serial")
.setStyle(TextInputStyle.Short)

const price = new TextInputBuilder()
.setCustomId("price")
.setLabel("Mệnh giá")
.setStyle(TextInputStyle.Short)

modal.addComponents(
new ActionRowBuilder().addComponents(type),
new ActionRowBuilder().addComponents(code),
new ActionRowBuilder().addComponents(serial),
new ActionRowBuilder().addComponents(price)
)

interaction.showModal(modal)

}

if(interaction.customId === "deposit_bank"){

const modal = new ModalBuilder()
.setCustomId("bank_modal")
.setTitle("Nạp chuyển khoản")

const gameid = new TextInputBuilder()
.setCustomId("gameid")
.setLabel("ID Game")
.setStyle(TextInputStyle.Short)

const money = new TextInputBuilder()
.setCustomId("money")
.setLabel("Số tiền")
.setStyle(TextInputStyle.Short)

modal.addComponents(
new ActionRowBuilder().addComponents(gameid),
new ActionRowBuilder().addComponents(money)
)

interaction.showModal(modal)

}

}

if(interaction.isModalSubmit()){

if(interaction.customId === "create_account"){

const name = interaction.fields.getTextInputValue("username")
const pass = interaction.fields.getTextInputValue("password")

db.createUser(interaction.user.id,name,pass)

interaction.reply({
content:"✅ Tạo tài khoản thành công",
ephemeral:true
})

}

if(interaction.customId === "bank_modal"){

const gameid = interaction.fields.getTextInputValue("gameid")
const money = interaction.fields.getTextInputValue("money")

const embed = new EmbedBuilder()

.setTitle("🏦 NẠP CHUYỂN KHOẢN")

.setDescription(`
ID GAME: **${gameid}**
SỐ TIỀN: **${money}**
Quét QR bên dưới
`)

.setImage(QR_IMAGE)

const row = new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId(`bank_done_${money}`)
.setLabel("✅ Tôi đã chuyển")
.setStyle(ButtonStyle.Success)

)

interaction.reply({
embeds:[embed],
components:[row],
ephemeral:true
})

}

if(interaction.customId === "card_modal"){

const type = interaction.fields.getTextInputValue("type")
const code = interaction.fields.getTextInputValue("code")
const serial = interaction.fields.getTextInputValue("serial")
const price = interaction.fields.getTextInputValue("price")

const channel = client.channels.cache.get(ADMIN_CHANNEL)

const row = new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId(`card_accept_${interaction.user.id}_${price}`)
.setLabel("Duyệt")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`card_reject`)
.setLabel("Từ chối")
.setStyle(ButtonStyle.Danger)

)

channel.send({

embeds:[

new EmbedBuilder()

.setTitle("💳 Yêu cầu nạp thẻ")

.setDescription(`

User: ${interaction.user.username}

Loại: ${type}
Mã: ${code}
Serial: ${serial}
Mệnh giá: ${price}

`)

],

components:[row]

})

interaction.reply({
content:"✅ Đã gửi admin duyệt",
ephemeral:true
})

}

}

})

client.login(TOKEN)