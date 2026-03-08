const fs = require("fs")

const file = "./userdata.json"

function load(){
return JSON.parse(fs.readFileSync(file))
}

function save(data){
fs.writeFileSync(file,JSON.stringify(data,null,2))
}

function getUser(id){

let data = load()

if(!data[id]){

data[id]={

username:"",
password:"",
money:0,
history:[],
logged:false

}

save(data)

}

return data[id]

}

function updateUser(id,user){

let data = load()

data[id]=user

save(data)

}

module.exports={getUser,updateUser}
