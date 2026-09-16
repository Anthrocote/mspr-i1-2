<?php

namespace App\DataFixtures;

use App\Entity\Pays;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    // The siège only configures the countries it consolidates: their 2-letter
    // code, name and ideal thresholds. Everything else (warehouses, exploitations,
    // products, lots, measurements, alerts) is PULLED from each country's backend
    // by the sync service, never seeded here — seeding it directly would short-
    // circuit the architecture the project is built on.
    //
    // Brazil is the instrumented country: its apiUrl/apiKey are wired from the
    // environment (PAYS_BR_API_URL / PAYS_BR_API_KEY) so a demo or e2e run boots
    // the pays stack and lets a real sync populate the siège. Ecuador and Colombia
    // are declared with their thresholds but no sync URL, exactly as the dossier
    // describes (declared at the siège, not instrumented).
    public function load(ObjectManager $manager): void
    {
        $brApiUrl = getenv('PAYS_BR_API_URL') ?: null;
        $brApiKey = getenv('PAYS_BR_API_KEY') ?: null;

        $pays = [
            ['br', 'Brésil',   29.0, 55.0, $brApiUrl, $brApiKey],
            ['ec', 'Équateur', 31.0, 60.0, null,      null],
            ['co', 'Colombie', 26.0, 80.0, null,      null],
        ];

        foreach ($pays as [$code, $nom, $temp, $humid, $apiUrl, $apiKey]) {
            $manager->persist(
                (new Pays())
                    ->setCode($code)
                    ->setNom($nom)
                    ->setTempIdeale($temp)
                    ->setHumiditeIdeale($humid)
                    ->setApiUrl($apiUrl)
                    ->setApiKey($apiKey)
            );
        }

        $manager->flush();
    }
}
