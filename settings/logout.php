<?php
include("function.php");

// Vérifier si l'utilisateur est connecté
if (isset($_SESSION["edzonmx"])) {
    // Détruire la session en cours
    session_destroy();

    // Rediriger l'utilisateur vers la page de connexion ou autre page appropriée
    header("Location: ../index.php"); // Remplacez "login.php" par la page de connexion ou autre page souhaitée
    exit();
}
