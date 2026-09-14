<?php

namespace App\DataFixtures;

use App\Entity\Entrepot;
use App\Entity\HistoriqueStockage;
use App\Entity\Lot;
use App\Entity\Pays;
use App\Entity\Produit;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // Pays avec conditions idéales (spec cahier des charges)
        $paysData = [
            ['Brésil',   'BRA', 29.0, 55.0],
            ['Équateur', 'ECU', 31.0, 60.0],
            ['Colombie', 'COL', 26.0, 80.0],
        ];

        $paysEntities = [];
        foreach ($paysData as [$nom, $iso, $temp, $humid]) {
            $p = (new Pays())
                ->setNom($nom)
                ->setCodeIso($iso)
                ->setTempIdeale($temp)
                ->setHumiditeIdeale($humid);
            $manager->persist($p);
            $paysEntities[$iso] = $p;
        }

        // Entrepôts (un par pays)
        $entrepots = [];
        $entrepotData = [
            ['BRA', 'Entrepôt Manaus',   12, 'Rua das Acácias', 69000, 'Manaus'],
            ['ECU', 'Entrepôt Quito',    8,  'Av. Amazonas',    17000, 'Quito'],
            ['COL', 'Entrepôt Bogotá',   45, 'Calle del Café',  11000, 'Bogotá'],
        ];

        foreach ($entrepotData as [$iso, $nom, $num, $adresse, $cp, $ville]) {
            $e = (new Entrepot())
                ->setNom($nom)
                ->setNumeroRue($num)
                ->setAdresse($adresse)
                ->setCodePostal($cp)
                ->setVille($ville)
                ->setPays($paysEntities[$iso]);
            $manager->persist($e);
            $entrepots[$iso] = $e;
        }

        // Produit exemple
        $produit = (new Produit())
            ->setNom('Arabica Minas Gerais')
            ->setDescription('Café vert Arabica de haute qualité, récolte 2025')
            ->setVariete('Arabica')
            ->setIntensite(7)
            ->setAmertume(4)
            ->setAcidite(8)
            ->setCorps(6);
        $manager->persist($produit);

        // Lots exemple avec historique stockage
        $lotsData = [
            ['BRA', 'LOT-BRA-2025-001', 500.0, '-60 days'],
            ['ECU', 'LOT-ECU-2025-001', 320.0, '-45 days'],
            ['COL', 'LOT-COL-2025-001', 410.0, '-30 days'],
        ];

        foreach ($lotsData as [$iso, $libelle, $quantite, $dateOffset]) {
            $lot = (new Lot())
                ->setLibelle($libelle)
                ->setQuantite($quantite)
                ->setProduit($produit)
                ->setStatut(Lot::STATUT_CONFORME);
            $manager->persist($lot);

            $hs = (new HistoriqueStockage())
                ->setLot($lot)
                ->setEntrepot($entrepots[$iso])
                ->setDateArrivee(new \DateTimeImmutable($dateOffset));
            $manager->persist($hs);
        }

        $manager->flush();
    }
}
