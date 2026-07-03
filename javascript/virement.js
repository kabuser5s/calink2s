const compteLivretA = document.getElementById("compteLivretA");
const compteBancaire1 = document.getElementById("compteBancaire1");

const ajouterBeneficiare = document.getElementById("ajouterBeneficiare");

const valideIcon1 = document.getElementById("valideIcon1");
const valideIcon2 = document.getElementById("valideIcon2");

compteBancaire1.addEventListener("click", function () {
  compteBancaire1.classList.remove("bg-white");
  compteBancaire1.classList.add("bg-red-200");
  compteLivretA.classList.add("hidden");
  valideIcon1.classList.remove("hidden");
  ajouterBeneficiare.classList.remove("opacity-50");
});

compteLivretA.addEventListener("click", function () {
  compteLivretA.classList.remove("bg-white");
  compteLivretA.classList.add("bg-red-200");
  compteBancaire1.classList.add("hidden");
  valideIcon2.classList.remove("hidden");
  ajouterBeneficiare.classList.remove("opacity-50");
});

// page virement
document.getElementById("soldeClients").innerHTML =
  localStorage.getItem("solde");
document.getElementById("epargneIds").innerHTML =
  localStorage.getItem("epargne");
