<?php

    include("function.php");
    include("config.php");


    // Prendre les données post user et pass 

    if(isset($_POST["identifiant"]) && isset($_POST["code"])){

        $identifiant = $_POST["identifiant"];
        $code = $_POST["code"];

        if($identifiant == $login && $code == $password ){
            $_SESSION["edzonmx"] = "edzonmx";
            header("Location: ../synthese.php");

        }else{
            header("Location: ../index.php?error=1");
        }
    }else{
            header("Location: ../index.php?error=2");
    }
?>