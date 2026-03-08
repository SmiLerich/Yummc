const {
Client,
GatewayIntentBits,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
ModalBuilder,
TextInputBuilder,
TextInputStyle
} = require("discord.js")

const db = require("./database")

const client = new Client({
intents:[GatewayIntentBits.Guilds]
})

const TOKEN = process.env.TOKEN
const ADMIN_CHANNEL = process.env.ADMIN_CHANNEL
const QR_IMAGE = process.env.QR_IMAGE

client.once("ready",()=>{

console.log("BANK BOT ONLINE")

})

client.on("interactionCreate",async interaction=>{

try{

// SLASH COMMAND
if(interaction.isChatInputCommand()){

if(interaction.commandName === "bank"){

const data = db.readDB()
const user = data.users[interaction.user.id]

if(!user){

const modal = new ModalBuilder()
.setCustomId("create_acc")
.setTitle("Mở tài khoản")

const name = new TextInputBuilder()
.setCustomId("name")
.setLabel("Tên tài khoản")
.setStyle(TextInputStyle.Short)

const pass = new TextInputBuilder()
.setCustomId("pass")
.setLabel("Mật khẩu")
.setStyle(TextInputStyle.Short)

modal.addComponents(
new ActionRowBuilder().addComponents(name),
new ActionRowBuilder().addComponents(pass)
)

return interaction.showModal(modal)

}

const embed = new EmbedBuilder()

.setTitle("🏦 BANK")

.setDescription(`
👤 Chủ TK: **${user.name}**
💰 Số dư: **${user.money} VND**
`)

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

// BUTTON
if(interaction.isButton()){

// MENU NẠP
if(interaction.customId === "deposit"){

const row = new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId("napcard")
.setLabel("📱 Nạp Card")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("napbank")
.setLabel("🏦 Nạp Bank")
.setStyle(ButtonStyle.Success)

)

return interaction.reply({
content:"Chọn phương thức nạp",
components:[row],
ephemeral:true
})

}

// NẠP CARD
if(interaction.customId === "napcard"){

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

return interaction.showModal(modal)

}

// NẠP BANK
if(interaction.customId === "napbank"){

const modal = new ModalBuilder()
.setCustomId("bank_modal")
.setTitle("Nạp bank")

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

return interaction.showModal(modal)

}

// TOP
if(interaction.customId === "top"){

const data = db.readDB()

const top = Object.entries(data.users)
.sort((a,b)=>b[1].money-a[1].money)
.slice(0,10)

let text=""

top.forEach((u,i)=>{

text += `${i+1}. ${u[1].name} - ${u[1].money}\n`

})

return interaction.reply({
embeds:[new EmbedBuilder().setTitle("TOP TIỀN").setDescription(text)],
ephemeral:true
})

}

// HISTORY
if(interaction.customId === "history"){

const data = db.readDB()

const list = data.history.filter(x=>x.user===interaction.user.id || x.from===interaction.user.id)

let text=""

list.slice(-10).forEach(x=>{

text += `${x.type} ${x.amount}\n`

})

return interaction.reply({
embeds:[new EmbedBuilder().setTitle("Lịch sử").setDescription(text || "Chưa có")],
ephemeral:true
})

}

}

// MODAL
if(interaction.isModalSubmit()){

// TẠO TK
if(interaction.customId === "create_acc"){

const name = interaction.fields.getTextInputValue("name")
const pass = interaction.fields.getTextInputValue("pass")

db.createUser(interaction.user.id,name,pass)

return interaction.reply({
content:"Tạo tài khoản thành công",
ephemeral:true
})

}

// NẠP BANK
if(interaction.customId === "bank_modal"){

const money = interaction.fields.getTextInputValue("money")

const embed = new EmbedBuilder()

.setTitle("NẠP CHUYỂN KHOẢN")
.setDescription(`Số tiền: ${money}`)
.setImage(QR_IMAGE)

const row = new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId(`bankdone_${interaction.user.id}_${money}`)
.setLabel("Tôi đã chuyển")
.setStyle(ButtonStyle.Success)

)

return interaction.reply({
embeds:[embed],
components:[row],
ephemeral:true
})

}

// NẠP CARD
if(interaction.customId === "card_modal"){

const price = interaction.fields.getTextInputValue("price")

const channel = client.channels.cache.get(ADMIN_CHANNEL)

const row = new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId(`cardok_${interaction.user.id}_${price}`)
.setLabel("Duyệt")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`cardno`)
.setLabel("Từ chối")
.setStyle(ButtonStyle.Danger)

)

channel.send({
embeds:[new EmbedBuilder().setTitle("Yêu cầu nạp thẻ").setDescription(`User: ${interaction.user.username}\nMệnh giá: ${price}`)],
components:[row]
})

return interaction.reply({
content:"Đã gửi admin duyệt",
ephemeral:true
})

}

}

}catch(e){

console.log(e)

if(!interaction.replied)
interaction.reply({content:"Có lỗi xảy ra",ephemeral:true})

}

})

client.login(TOKEN)