const {
Client,
GatewayIntentBits,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
ModalBuilder,
TextInputBuilder,
TextInputStyle,
SlashCommandBuilder
}=require("discord.js")

const config=require("./config.json")
const db=require("./database")

const client=new Client({
intents:[GatewayIntentBits.Guilds]
})

/* ================= READY ================= */

client.on("ready",async()=>{

console.log("🏦 YUMMC BANK ONLINE")

const commands=[

new SlashCommandBuilder()
.setName("openbank")
.setDescription("Mở tài khoản ngân hàng"),

new SlashCommandBuilder()
.setName("bank")
.setDescription("Mở giao diện ngân hàng"),

new SlashCommandBuilder()
.setName("topbank")
.setDescription("Xem top giàu")

]

await client.application.commands.set(commands)

})

/* ================= SLASH ================= */

client.on("interactionCreate",async interaction=>{

if(interaction.isChatInputCommand()){

/* OPEN BANK */

if(interaction.commandName==="openbank"){

const modal=new ModalBuilder()

.setCustomId("openbank_modal")

.setTitle("🏦 Mở tài khoản ngân hàng")

const name=new TextInputBuilder()

.setCustomId("name")
.setLabel("Tên tài khoản")
.setStyle(TextInputStyle.Short)

const pass=new TextInputBuilder()

.setCustomId("pass")
.setLabel("Mật khẩu")
.setStyle(TextInputStyle.Short)

modal.addComponents(

new ActionRowBuilder().addComponents(name),

new ActionRowBuilder().addComponents(pass)

)

return interaction.showModal(modal)

}

/* BANK */

if(interaction.commandName==="bank"){

let user=db.getUser(interaction.user.id)

if(!user.logged){

const modal=new ModalBuilder()

.setCustomId("login_modal")

.setTitle("🔐 Đăng nhập ngân hàng")

const pass=new TextInputBuilder()

.setCustomId("pass")
.setLabel("Nhập mật khẩu")
.setStyle(TextInputStyle.Short)

modal.addComponents(

new ActionRowBuilder().addComponents(pass)

)

return interaction.showModal(modal)

}

showBankUI(interaction)

}

/* TOP BANK */

if(interaction.commandName==="topbank"){

const data=require("./userdata.json")

let arr=Object.entries(data)

.sort((a,b)=>b[1].money-a[1].money)

.slice(0,10)

let text=""

arr.forEach((u,i)=>{

text+=`**${i+1}.** <@${u[0]}> - ${u[1].money} VND\n`

})

const embed=new EmbedBuilder()

.setTitle("💰 TOP ĐẠI GIA YUMMC")

.setColor("Gold")

.setDescription(text)

interaction.reply({embeds:[embed]})

}

}

/* ================= MODAL ================= */

if(interaction.isModalSubmit()){

/* CREATE ACCOUNT */

if(interaction.customId==="openbank_modal"){

let name=interaction.fields.getTextInputValue("name")
let pass=interaction.fields.getTextInputValue("pass")

let user=db.getUser(interaction.user.id)

user.username=name
user.password=pass

db.updateUser(interaction.user.id,user)

return interaction.reply("✅ Mở tài khoản thành công")

}

/* LOGIN */

if(interaction.customId==="login_modal"){

let pass=interaction.fields.getTextInputValue("pass")

let user=db.getUser(interaction.user.id)

if(user.password!==pass)
return interaction.reply({content:"❌ Sai mật khẩu",ephemeral:true})

user.logged=true

db.updateUser(interaction.user.id,user)

return showBankUI(interaction)

}

}

/* ================= BUTTON ================= */

if(interaction.isButton()){

/* NẠP TIỀN */

if(interaction.customId==="nap_tien"){

const embed=new EmbedBuilder()

.setTitle("💳 NẠP TIỀN")

.setDescription("Chọn phương thức nạp")

.setColor("Green")

const row=new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId("nap_card")
.setLabel("📱 Nạp Card")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("nap_bank")
.setLabel("🏦 Nạp Bank")
.setStyle(ButtonStyle.Success)

)

return interaction.reply({embeds:[embed],components:[row],ephemeral:true})

}

/* NẠP BANK */

if(interaction.customId==="nap_bank"){

const embed=new EmbedBuilder()

.setTitle("🏦 NẠP CHUYỂN KHOẢN")

.setDescription("Quét QR bên dưới để chuyển")

.setImage(config.qrImage)

.setColor("Blue")

const row=new ActionRowBuilder()

.addComponents(

new ButtonBuilder()

.setCustomId("bank_done")

.setLabel("✅ Tôi đã chuyển")

.setStyle(ButtonStyle.Success)

)

return interaction.reply({embeds:[embed],components:[row],ephemeral:true})

}

}

})

/* ================= BANK UI ================= */

function showBankUI(interaction){

let user=db.getUser(interaction.user.id)

const embed=new EmbedBuilder()

.setColor("#FFD700")

.setDescription(`

┏━━━━━━━━━━━━━━━━━━━━━━┓
      🏦 **YUMMC BANK**
┗━━━━━━━━━━━━━━━━━━━━━━┛

👤 **Chủ TK:** ${user.username}

💰 **Số dư:** ${user.money.toLocaleString()} VND

`)

const row=new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId("nap_tien")
.setLabel("💳 Nạp tiền")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("chuyen_tien")
.setLabel("💸 Chuyển tiền")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("top")
.setLabel("📊 Top")
.setStyle(ButtonStyle.Secondary),

new ButtonBuilder()
.setCustomId("history")
.setLabel("📜 Lịch sử")
.setStyle(ButtonStyle.Secondary)

)

interaction.reply({embeds:[embed],components:[row]})

}

client.login(config.token)
