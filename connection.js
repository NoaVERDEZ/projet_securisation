const mysql = require('mysql');// Importation du module MySQL
const config = require('./config.json')// Chargement de la configuration depuis un fichier JSON
// Création de la connexion à la base de données avec les paramètres définis dans config.json
connection = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password, 
    database: config.database.database
})
// Établissement de la connexion à MySQL
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
        throw err;
    }
    console.log('Connecté à la base de données MySQL'); 
});

module.exports = connection;  // Exportation de la connexion pour l'utiliser dans d'autres fichiers