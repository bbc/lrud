require('babel-register')

const app = require('./routes').default
const port = process.env.PORT || 8080

app.listen(port, () => console.log(`Listening on port http://localhost:${port}`))
