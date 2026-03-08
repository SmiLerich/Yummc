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

const db=require("./database")

const TOKEN=process.env.TOKEN
const ADMIN_ROLE=process.env.ADMIN_ROLE
const ADMIN_CHANNEL=process.env.ADMIN_CHANNEL
const QR_IMAGE=process.env.QR_IMAGE

const client=new Client({
intents:[GatewayIntentBits.Guilds]
})

/* READY */

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
.setDescription("Top người giàu")

]

await client.application.commands.set(commands)

})

/* INTERACTION */

client.on("interactionCreate",async interaction=>{

/* SLASH */

if(interaction.isChatInputCommand()){

if(interaction.commandName==="openbank"){

const modal=new ModalBuilder()

.setCustomId("openbank")

.setTitle("Mở tài khoản")

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

if(interaction.commandName==="bank"){

let user=db.getUser(interaction.user.id)

if(!user.logged){

const modal=new ModalBuilder()

.setCustomId("login")

.setTitle("Đăng nhập ngân hàng")

const pass=new TextInputBuilder()

.setCustomId("pass")
.setLabel("Mật khẩu")
.setStyle(TextInputStyle.Short)

modal.addComponents(

new ActionRowBuilder().addComponents(pass)

)

return interaction.showModal(modal)

}

showBank(interaction)

}

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

.setTitle("💰 TOP ĐẠI GIA")

.setColor("Gold")

.setDescription(text)

interaction.reply({embeds:[embed]})

}

}

/* MODAL */

if(interaction.isModalSubmit()){

if(interaction.customId==="openbank"){

let name=interaction.fields.getTextInputValue("name")
let pass=interaction.fields.getTextInputValue("pass")

let user=db.getUser(interaction.user.id)

user.username=name
user.password=pass

db.updateUser(interaction.user.id,user)

return interaction.reply("✅ Mở tài khoản thành công")

}

if(interaction.customId==="login"){

let pass=interaction.fields.getTextInputValue("pass")

let user=db.getUser(interaction.user.id)

if(user.password!==pass)
return interaction.reply({content:"❌ Sai mật khẩu",ephemeral:true})

user.logged=true

db.updateUser(interaction.user.id,user)

return showBank(interaction)

}

}

/* BUTTON */

if(interaction.isButton()){

if(interaction.customId==="nap"){

const embed=new EmbedBuilder()

.setTitle("💳 NẠP TIỀN")

.setDescription("Chọn phương thức")

const row=new ActionRowBuilder()

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

return interaction.reply({embeds:[embed],components:[row],ephemeral:true})

}

if(interaction.customId==="napbank"){

const embed=new EmbedBuilder()

.setTitle("🏦 NẠP CHUYỂN KHOẢN")

.setDescription("Quét QR bên dưới")

.setImage(QR_IMAGE)

const row=new ActionRowBuilder()

.addComponents(

new ButtonBuilder()

.setCustomId("bankdone")

.setLabel("✅ Tôi đã chuyển")

.setStyle(ButtonStyle.Success)

)

return interaction.reply({embeds:[embed],components:[row],ephemeral:true})

}

}

})

/* BANK UI */

function showBank(interaction){

let user=db.getUser(interaction.user.id)

const embed=new EmbedBuilder()

.setColor("#FFD700")

.setDescription(`

┏━━━━━━━━━━━━━━━━━━━━━━┓
      🏦 **YUMMC BANK**
┗━━━━━━━━━━━━━━━━━━━━━━┛

👤 Chủ TK: **${user.username}**

💰 Số dư: **${user.money.toLocaleString()} VND**

`)

const row=new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId("nap")
.setLabel("💳 Nạp tiền")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("top")
.setLabel("📊 Top")
.setStyle(ButtonStyle.Secondary)

)

interaction.reply({embeds:[embed],components:[row]})

}

client.login(TOKEN)