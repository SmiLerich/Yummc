const fs = require("fs")

function readDB(){
return JSON.parse(fs.readFileSync("./userdata.json"))
}

function writeDB(data){
fs.writeFileSync("./userdata.json",JSON.stringify(data,null,2))
}

function getUser(id){
const db = readDB()
return db.users[id]
}

function createUser(id,username,password){

const db = readDB()

db.users[id] = {
username,
password,
money:0
}

writeDB(db)

}

function addMoney(id,amount){

const db = readDB()

db.users[id].money += amount

writeDB(db)

}

function transfer(from,to,amount){

const db = readDB()

db.users[from].money -= amount
db.users[to].money += amount

db.history.push({
type:"transfer",
from,
to,
amount,
time:Date.now()
})

writeDB(db)

}

module.exports = {
readDB,
writeDB,
getUser,
createUser,
addMoney,
transfer
}