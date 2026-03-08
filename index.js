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

const TOKEN = process.env.TOKEN || "BOT_TOKEN"
const ADMIN_ROLE = process.env.ADMIN_ROLE || "ADMIN_ROLE_ID"
const ADMIN_CHANNEL = process.env.ADMIN_CHANNEL || "ADMIN_CHANNEL_ID"
const QR_IMAGE = process.env.QR_IMAGE || "QR_LINK"

client.once("ready",()=>{

console.log("Bank bot online")

})

client.on("interactionCreate", async interaction => {

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

if(interaction.isModalSubmit()){

if(interaction.customId === "create_account"){

const name = interaction.fields.getTextInputValue("username")
const pass = interaction.fields.getTextInputValue("password")

db.createUser(interaction.user.id,name,pass)

interaction.reply({
content:"✅ Tạo tài khoản thành công!",
ephemeral:true
})

}

if(interaction.customId === "modal_transfer"){

const target = interaction.fields.getTextInputValue("target")
const amount = parseInt(interaction.fields.getTextInputValue("amount"))

const dbdata = db.readDB()

if(!dbdata.users[target]){

return interaction.reply({
content:"❌ Người nhận không tồn tại",
ephemeral:true
})

}

if(dbdata.users[interaction.user.id].money < amount){

return interaction.reply({
content:"❌ Không đủ tiền",
ephemeral:true
})

}

db.transfer(interaction.user.id,target,amount)

interaction.reply({
content:`✅ Đã chuyển ${amount} VND`,
ephemeral:true
})

}

}

if(interaction.isButton()){

if(interaction.customId === "deposit"){

const embed = new EmbedBuilder()

.setTitle("💰 NẠP TIỀN")

.setDescription("Chọn phương thức")

.setColor("Blue")

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
embeds:[embed],
components:[row],
ephemeral:true
})

}

if(interaction.customId === "deposit_bank"){

const embed = new EmbedBuilder()

.setTitle("🏦 NẠP CHUYỂN KHOẢN")

.setDescription("Quét QR bên dưới")

.setImage(QR_IMAGE)

const row = new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId("bank_done")
.setLabel("✅ Tôi đã chuyển")
.setStyle(ButtonStyle.Success)

)

interaction.reply({
embeds:[embed],
components:[row],
ephemeral:true
})

}

if(interaction.customId === "bank_done"){

const channel = client.channels.cache.get(ADMIN_CHANNEL)

channel.send(`💰 ${interaction.user} đã gửi yêu cầu nạp bank`)

interaction.reply({
content:"✅ Đã gửi admin duyệt",
ephemeral:true
})

}

if(interaction.customId === "transfer"){

const modal = new ModalBuilder()

.setCustomId("modal_transfer")

.setTitle("Chuyển tiền")

const user = new TextInputBuilder()

.setCustomId("target")

.setLabel("ID người nhận")

.setStyle(TextInputStyle.Short)

const money = new TextInputBuilder()

.setCustomId("amount")

.setLabel("Số tiền")

.setStyle(TextInputStyle.Short)

modal.addComponents(

new ActionRowBuilder().addComponents(user),
new ActionRowBuilder().addComponents(money)

)

interaction.showModal(modal)

}

if(interaction.customId === "history"){

const data = db.readDB()

const list = data.history

.filter(x=>x.from===interaction.user.id||x.to===interaction.user.id)

.slice(-10)

let text=""

list.forEach(x=>{

text+=`💰 ${x.amount} VND\n`

})

const embed = new EmbedBuilder()

.setTitle("📜 Lịch sử")

.setDescription(text||"Chưa có")

interaction.reply({
embeds:[embed],
ephemeral:true
})

}

if(interaction.customId === "top"){

const data = db.readDB()

const top = Object.entries(data.users)

.sort((a,b)=>b[1].money-a[1].money)

.slice(0,10)

let text=""

top.forEach((u,i)=>{

text+=`#${i+1} <@${u[0]}> ${u[1].money} VND\n`

})

const embed = new EmbedBuilder()

.setTitle("🏆 TOP TIỀN")

.setDescription(text)

interaction.reply({
embeds:[embed],
ephemeral:true
})

}

}

})

client.login(TOKEN)