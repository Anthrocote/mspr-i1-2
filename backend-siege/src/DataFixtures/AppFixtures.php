<?php

namespace App\DataFixtures;

use App\Entity\Alerte;
use App\Entity\Entrepot;
use App\Entity\HistoriqueStockage;
use App\Entity\Lot;
use App\Entity\Mesure;
use App\Entity\Pays;
use App\Entity\Produit;
use App\Entity\Role;
use App\Entity\Utilisateur;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(private readonly UserPasswordHasherInterface $hasher)
    {
    }

    public function load(ObjectManager $manager): void
    {
        // ── Rôles ────────────────────────────────────────────────────────────
        $roleAdmin = (new Role())->setLibelle('ROLE_ADMIN');
        $roleUser  = (new Role())->setLibelle('ROLE_USER');
        $manager->persist($roleAdmin);
        $manager->persist($roleUser);

        // ── Pays ─────────────────────────────────────────────────────────────
        [$brasil, $equateur, $colombie] = $this->createPays($manager);

        // ── Entrepôts (2 par pays) ────────────────────────────────────────────
        $entrepots = $this->createEntrepots($manager, $brasil, $equateur, $colombie);

        // ── Produits ──────────────────────────────────────────────────────────
        $produits = $this->createProduits($manager);

        // ── Utilisateurs ──────────────────────────────────────────────────────
        $this->createUtilisateurs($manager, $roleAdmin, $roleUser, $entrepots);

        $manager->flush();

        // ── Lots + historique ─────────────────────────────────────────────────
        $lots = $this->createLots($manager, $produits, $entrepots);

        $manager->flush();

        // ── Mesures IoT (30 jours, 4 relevés/jour/entrepôt) ──────────────────
        $this->createMesures($manager, $entrepots);

        $manager->flush();

        // ── Alertes ───────────────────────────────────────────────────────────
        $this->createAlertes($manager, $lots, $entrepots);

        $manager->flush();
    }

    /** @return Pays[] [brasil, equateur, colombie] */
    private function createPays(ObjectManager $manager): array
    {
        $data = [
            ['Brésil',   'BRA', 29.0, 55.0],
            ['Équateur', 'ECU', 31.0, 60.0],
            ['Colombie', 'COL', 26.0, 80.0],
        ];

        $result = [];
        foreach ($data as [$nom, $iso, $temp, $humid]) {
            $p = (new Pays())
                ->setNom($nom)
                ->setCodeIso($iso)
                ->setTempIdeale($temp)
                ->setHumiditeIdeale($humid)
                ->setLastSyncedAt(new \DateTimeImmutable('-2 minutes'));
            $manager->persist($p);
            $result[] = $p;
        }
        return $result;
    }

    /** @return Entrepot[] [bra1, bra2, ecu1, ecu2, col1, col2] */
    private function createEntrepots(ObjectManager $manager, Pays $brasil, Pays $equateur, Pays $colombie): array
    {
        $data = [
            [$brasil,   'Entrepôt Manaus',      12, 'Rua das Acácias',      69000, 'Manaus'],
            [$brasil,   'Entrepôt São Paulo',    88, 'Av. Paulista',         01310, 'São Paulo'],
            [$equateur, 'Entrepôt Quito',         8, 'Av. Amazonas',         17000, 'Quito'],
            [$equateur, 'Entrepôt Guayaquil',    34, 'Calle Olmedo',          9000, 'Guayaquil'],
            [$colombie, 'Entrepôt Bogotá',       45, 'Calle del Café',       11000, 'Bogotá'],
            [$colombie, 'Entrepôt Medellín',     17, 'Carrera El Poblado',    5001, 'Medellín'],
        ];

        $result = [];
        foreach ($data as [$pays, $nom, $num, $adresse, $cp, $ville]) {
            $e = (new Entrepot())
                ->setNom($nom)
                ->setNumeroRue($num)
                ->setAdresse($adresse)
                ->setCodePostal($cp)
                ->setVille($ville)
                ->setPays($pays);
            $manager->persist($e);
            $result[] = $e;
        }
        return $result;
    }

    /** @return Produit[] */
    private function createProduits(ObjectManager $manager): array
    {
        $data = [
            ['Arabica Minas Gerais',    'Café vert Arabica de haute qualité, récolte 2025. Notes de chocolat et noisette.', 'Arabica',  7, 4, 8, 6],
            ['Robusta São Paulo',       'Café Robusta corsé avec une belle crema. Idéal pour espresso.',                    'Robusta',  9, 8, 3, 9],
            ['Arabica Highland Quito',  'Arabica de haute altitude, fraîcheur et légèreté caractéristiques.',               'Arabica',  5, 3, 9, 4],
            ['Arabica Colombie Supremo','Grain Supremo d\'exception, équilibre parfait entre acidité et douceur.',          'Arabica',  6, 4, 7, 7],
        ];

        $result = [];
        foreach ($data as [$nom, $desc, $variete, $intensite, $amertume, $acidite, $corps]) {
            $p = (new Produit())
                ->setNom($nom)
                ->setDescription($desc)
                ->setVariete($variete)
                ->setIntensite($intensite)
                ->setAmertume($amertume)
                ->setAcidite($acidite)
                ->setCorps($corps);
            $manager->persist($p);
            $result[] = $p;
        }
        return $result;
    }

    private function createUtilisateurs(ObjectManager $manager, Role $roleAdmin, Role $roleUser, array $entrepots): void
    {
        // Admin siège
        $admin = (new Utilisateur())
            ->setNom('Admin')
            ->setPrenom('Siège')
            ->setEmail('admin@futurekawa.com')
            ->setRole($roleAdmin);
        $admin->setPassword($this->hasher->hashPassword($admin, 'admin1234'));
        $manager->persist($admin);

        // Gestionnaires par entrepôt
        $gestionnaires = [
            ['Oliveira', 'Carlos',   'gestionnaire.bresil@futurekawa.com',    $entrepots[0]],
            ['Morales',  'Isabella', 'gestionnaire.equateur@futurekawa.com',  $entrepots[2]],
            ['Restrepo', 'Andrés',   'gestionnaire.colombie@futurekawa.com',  $entrepots[4]],
        ];

        foreach ($gestionnaires as [$nom, $prenom, $email, $entrepot]) {
            $u = (new Utilisateur())
                ->setNom($nom)
                ->setPrenom($prenom)
                ->setEmail($email)
                ->setRole($roleUser)
                ->setEntrepot($entrepot);
            $u->setPassword($this->hasher->hashPassword($u, 'user1234'));
            $manager->persist($u);
        }
    }

    /**
     * @param Produit[] $produits
     * @param Entrepot[] $entrepots
     * @return Lot[]
     */
    private function createLots(ObjectManager $manager, array $produits, array $entrepots): array
    {
        [$arabicaBresil, $robustaBresil, $arabicaEquateur, $arabicaColombie] = $produits;
        [$bra1, $bra2, $ecu1, $ecu2, $col1, $col2] = $entrepots;

        $lotsData = [
            // [libelle, quantite, produit, statut, entrepot, dateArrivee, dateDepart]
            ['LOT-BRA-2025-001', 500.0, $arabicaBresil,   Lot::STATUT_CONFORME,  $bra1, '-60 days',  null],
            ['LOT-BRA-2025-002', 280.0, $robustaBresil,   Lot::STATUT_EN_ALERTE, $bra1, '-45 days',  null],
            ['LOT-BRA-2024-001', 150.0, $arabicaBresil,   Lot::STATUT_PERIME,    $bra2, '-400 days', null],
            ['LOT-ECU-2025-001', 320.0, $arabicaEquateur, Lot::STATUT_CONFORME,  $ecu1, '-30 days',  null],
            ['LOT-ECU-2025-002', 410.0, $arabicaEquateur, Lot::STATUT_CONFORME,  $ecu2, '-20 days',  null],
            ['LOT-ECU-2025-003', 190.0, $arabicaEquateur, Lot::STATUT_EN_ALERTE, $ecu1, '-55 days',  null],
            ['LOT-COL-2025-001', 600.0, $arabicaColombie, Lot::STATUT_CONFORME,  $col1, '-15 days',  null],
            ['LOT-COL-2025-002', 350.0, $arabicaColombie, Lot::STATUT_CONFORME,  $col2, '-25 days',  null],
            ['LOT-COL-2024-001', 200.0, $arabicaColombie, Lot::STATUT_PERIME,    $col1, '-390 days', null],
            ['LOT-COL-2025-003', 420.0, $arabicaColombie, Lot::STATUT_EN_ALERTE, $col2, '-70 days',  null],
        ];

        $lots = [];
        foreach ($lotsData as [$libelle, $quantite, $produit, $statut, $entrepot, $arrivee, $depart]) {
            $lot = (new Lot())
                ->setLibelle($libelle)
                ->setQuantite($quantite)
                ->setProduit($produit)
                ->setStatut($statut);
            $manager->persist($lot);

            $hs = (new HistoriqueStockage())
                ->setLot($lot)
                ->setEntrepot($entrepot)
                ->setDateArrivee(new \DateTimeImmutable($arrivee));
            if ($depart !== null) {
                $hs->setDateDepart(new \DateTimeImmutable($depart));
            }
            $manager->persist($hs);

            $lots[] = $lot;
        }

        return $lots;
    }

    /** @param Entrepot[] $entrepots */
    private function createMesures(ObjectManager $manager, array $entrepots): void
    {
        // Conditions idéales par entrepôt [tempBase, humiditeBase]
        $conditions = [
            [29.0, 55.0], // bra1 Manaus
            [29.0, 55.0], // bra2 São Paulo
            [31.0, 60.0], // ecu1 Quito
            [31.0, 60.0], // ecu2 Guayaquil
            [26.0, 80.0], // col1 Bogotá
            [26.0, 80.0], // col2 Medellín
        ];

        // Scénarios de dérive : entrepôt index => [jour début, jour fin, delta temp, delta humid]
        $anomalies = [
            0 => [[-12, -7,  +4.5, +0.0]],  // bra1 : pic de température (hors tolérance)
            2 => [[-8,  -3,  +0.0, +3.5]],  // ecu1 : humidité trop élevée
            5 => [[-15, -10, +3.8, +0.0]],  // col2 : pic de température
        ];

        $batchSize = 50;
        $count = 0;

        foreach ($entrepots as $idx => $entrepot) {
            [$tempBase, $humBase] = $conditions[$idx];
            $entrepotAnomalies = $anomalies[$idx] ?? [];

            for ($day = -30; $day <= 0; $day++) {
                // 4 relevés par jour (06h, 12h, 18h, 00h)
                foreach ([6, 12, 18, 23] as $hour) {
                    $deltaTemp  = 0.0;
                    $deltaHumid = 0.0;

                    foreach ($entrepotAnomalies as [$start, $end, $dt, $dh]) {
                        if ($day >= $start && $day <= $end) {
                            $deltaTemp  = $dt;
                            $deltaHumid = $dh;
                        }
                    }

                    // Variation aléatoire naturelle ±0.8°C / ±0.5%
                    $jitter = fn(float $amplitude): float => (mt_rand(-100, 100) / 100) * $amplitude;

                    $mesure = (new Mesure())
                        ->setEntrepot($entrepot)
                        ->setTemperature(round($tempBase + $deltaTemp + $jitter(0.8), 1))
                        ->setHumidite(round($humBase + $deltaHumid + $jitter(0.5), 1))
                        ->setMesureLe(new \DateTimeImmutable(sprintf('%d days %02d:00:00', $day, $hour)));
                    $manager->persist($mesure);

                    if (++$count % $batchSize === 0) {
                        $manager->flush();
                    }
                }
            }
        }
    }

    /**
     * @param Lot[]     $lots
     * @param Entrepot[] $entrepots
     */
    private function createAlertes(ObjectManager $manager, array $lots, array $entrepots): void
    {
        // lots[1] = LOT-BRA-2025-002 (en_alerte), lots[5] = LOT-ECU-2025-003, lots[9] = LOT-COL-2025-003
        // lots[2] = LOT-BRA-2024-001 (périmé),    lots[8] = LOT-COL-2024-001

        $alertes = [
            // Actives
            [Alerte::TYPE_CONDITION_HORS_PLAGE, null,     $entrepots[0], '-10 days', null],        // bra1 : température
            [Alerte::TYPE_CONDITION_HORS_PLAGE, null,     $entrepots[2], '-6 days',  null],        // ecu1 : humidité
            [Alerte::TYPE_CONDITION_HORS_PLAGE, null,     $entrepots[5], '-13 days', null],        // col2 : température
            [Alerte::TYPE_LOT_PERIME,           $lots[2], null,           '-5 days',  null],       // lot périmé Brésil
            [Alerte::TYPE_LOT_PERIME,           $lots[8], null,           '-3 days',  null],       // lot périmé Colombie
            // Résolues
            [Alerte::TYPE_CONDITION_HORS_PLAGE, null,     $entrepots[4], '-20 days', '-18 days'],  // col1 : résolue
            [Alerte::TYPE_LOT_PERIME,           $lots[9], null,           '-25 days', '-20 days'], // lot en_alerte Colombie : résolue
        ];

        foreach ($alertes as [$type, $lot, $entrepot, $declenchee, $resolue]) {
            $alerte = (new Alerte())
                ->setType($type)
                ->setLot($lot)
                ->setEntrepot($entrepot)
                ->setDeclencheeLe(new \DateTimeImmutable($declenchee));

            if ($resolue !== null) {
                $alerte->setResolueLe(new \DateTimeImmutable($resolue));
            }

            $manager->persist($alerte);
        }
    }
}
