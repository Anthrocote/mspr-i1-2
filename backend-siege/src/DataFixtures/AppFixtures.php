<?php

namespace App\DataFixtures;

use App\Entity\Alerte;
use App\Entity\Entrepot;
use App\Entity\Exploitation;
use App\Entity\HistoriqueStockage;
use App\Entity\Lot;
use App\Entity\Mesure;
use App\Entity\Pays;
use App\Entity\Produit;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\Uid\Uuid;

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
                ->setUuid(Uuid::v4())
                ->setNom($nom)
                ->setNumeroRue($num)
                ->setAdresse($adresse)
                ->setCodePostal($cp)
                ->setVille($ville)
                ->setPays($paysEntities[$iso]);
            $manager->persist($e);
            $entrepots[$iso] = $e;
        }

        // Exploitations (une par pays)
        $exploitations = [];
        $exploitationData = [
            ['BRA', 'Fazenda Serra Verde'],
            ['ECU', 'Finca El Cóndor'],
            ['COL', 'Hacienda La Esperanza'],
        ];

        foreach ($exploitationData as [$iso, $nom]) {
            $exploitation = (new Exploitation())
                ->setUuid(Uuid::v4())
                ->setNom($nom)
                ->setPays($paysEntities[$iso]);
            $manager->persist($exploitation);
            $exploitations[$iso] = $exploitation;
        }

        // Produit exemple
        $produit = (new Produit())
            ->setUuid(Uuid::v4())
            ->setNom('Arabica Minas Gerais')
            ->setDescription('Café vert Arabica de haute qualité, récolte 2025')
            ->setVariete('Arabica')
            ->setIntensite(7)
            ->setAmertume(4)
            ->setAcidite(8)
            ->setCorps(6);
        $manager->persist($produit);

        // Lots exemple avec historique stockage. Statuts variés pour couvrir les
        // trois états du cahier des charges (conforme / en alerte / périmé) ; le
        // dernier lot dépasse 365 jours de stockage (règle "lot trop ancien").
        $lotsData = [
            ['BRA', 'LOT-BRA-2025-001', 500.0, '-60 days',  Lot::STATUT_CONFORME],
            ['ECU', 'LOT-ECU-2025-001', 320.0, '-200 days', Lot::STATUT_EN_ALERTE],
            ['COL', 'LOT-COL-2025-001', 410.0, '-30 days',  Lot::STATUT_CONFORME],
            ['BRA', 'LOT-BRA-2024-042', 280.0, '-400 days', Lot::STATUT_PERIME],
        ];

        $lots = [];
        foreach ($lotsData as [$iso, $libelle, $quantite, $dateOffset, $statut]) {
            $lot = (new Lot())
                ->setUuid(Uuid::v4())
                ->setLibelle($libelle)
                ->setQuantite($quantite)
                ->setProduit($produit)
                ->setExploitation($exploitations[$iso])
                ->setConstitueeLe(new \DateTimeImmutable($dateOffset))
                ->setStatut($statut);
            $manager->persist($lot);
            $lots[$libelle] = $lot;

            $hs = (new HistoriqueStockage())
                ->setLot($lot)
                ->setEntrepot($entrepots[$iso])
                ->setDateArrivee(new \DateTimeImmutable($dateOffset));
            $manager->persist($hs);
        }

        // Séries de mesures IoT : 12 relevés horaires par entrepôt pour tracer les
        // courbes température/humidité. Le dernier relevé du Brésil sort de la plage
        // idéale (29 °C ±3) pour illustrer une condition hors seuil.
        $ideal = ['BRA' => [29.0, 55.0], 'ECU' => [31.0, 60.0], 'COL' => [26.0, 80.0]];
        foreach ($entrepots as $iso => $entrepot) {
            [$tempIdeal, $humIdeal] = $ideal[$iso];
            for ($h = 11; $h >= 0; $h--) {
                $wave = sin($h / 2);
                $temp = $tempIdeal + $wave;
                $hum = $humIdeal + $wave;
                if ($iso === 'BRA' && $h === 0) {
                    $temp = $tempIdeal + 5.0; // spike above the +3 °C tolerance
                }
                $manager->persist((new Mesure())
                    ->setUuid(Uuid::v4())
                    ->setEntrepot($entrepot)
                    ->setTemperature(round($temp, 1))
                    ->setHumidite(round($hum, 1))
                    ->setMesureLe(new \DateTimeImmutable("-{$h} hours")));
            }
        }

        // Alertes : les deux cas du cahier des charges (condition hors plage,
        // lot trop ancien).
        $manager->persist((new Alerte())
            ->setUuid(Uuid::v4())
            ->setType(Alerte::TYPE_CONDITION_HORS_PLAGE)
            ->setEntrepot($entrepots['BRA'])
            ->setDeclencheeLe(new \DateTimeImmutable('-1 hour')));

        $manager->persist((new Alerte())
            ->setUuid(Uuid::v4())
            ->setType(Alerte::TYPE_LOT_PERIME)
            ->setLot($lots['LOT-BRA-2024-042'])
            ->setEntrepot($entrepots['BRA'])
            ->setDeclencheeLe(new \DateTimeImmutable('-2 days')));

        // A resolved alert so the history view (status=all / resolved filter) has
        // a closed case to show alongside the two active ones.
        $manager->persist((new Alerte())
            ->setUuid(Uuid::v4())
            ->setType(Alerte::TYPE_CAPTEUR_HORS_LIGNE)
            ->setEntrepot($entrepots['BRA'])
            ->setDeclencheeLe(new \DateTimeImmutable('-3 days'))
            ->setResolueLe(new \DateTimeImmutable('-3 days +2 hours')));

        $manager->flush();
    }
}
