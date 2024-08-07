const express = require('express');
const app = express()
const toolRouter = require('./routers/toolRouter')
const PORT=4000
app.use(express.json())

app.use('/api',toolRouter)
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})