const express =  require('express')
const bodyParser = require('body-parser')

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));

const usersRoute = require('./routes/Users.js');
const photoRoute = require('./routes/Photo.js');
const progressRoute = require('./routes/Progress.js');
const tabelRoute = require('./routes/Tabel.js');
const exercisePostureRoute = require('./routes/Exerices_Post.js');


app.use('/user',usersRoute);
app.use("/photo",photoRoute);
app.use('/progress',progressRoute);
app.use('/tabel',tabelRoute);
app.use('/exPost',exercisePostureRoute);

app.get('/hello',(req, res )=>{
  res.send("hello world");
})

// app.get('/Users',async (req, res)=>{
//   const data = await getUsers();
//   console.log(data)
//   res.send(data)
// })

// app.get('/Users/:id',async (req, res)=>{
//   const  id = req.params.id
//   const data = await g.getUsers();
//   res.send(data)
// })

app.listen(8080,()=>{
  console.log("Server is running on port 8080");
})
