<?php

namespace App\Tests\Integration\Controller;

use App\Entity\Entrepot;
use App\Entity\Mesure;
use App\Entity\Pays;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

class MesureControllerTest extends ApiTestCase
{
    private const SEEDED = 250; // deliberately above the 200 pagination cap

    public function testShowNonExistentWarehouseReturns404(): void
    {
        $this->client->request('GET', '/api/warehouses/00000000-0000-0000-0000-000000000000/measurements');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testDateFilterReturnsWholeRangeUnpaginated(): void
    {
        $uuid = $this->seed();
        $from = (new \DateTimeImmutable('-2 hours'))->format(\DateTimeInterface::ATOM);

        $this->client->request('GET', "/api/warehouses/$uuid/measurements?from=" . urlencode($from));

        $this->assertResponseIsSuccessful();
        $body = json_decode($this->client->getResponse()->getContent(), true);
        // The full window comes back in one response, beyond the 200 cap.
        $this->assertCount(self::SEEDED, $body['data']);
        $this->assertSame(self::SEEDED, $body['pagination']['total']);
        $this->assertSame(1, $body['pagination']['pages']);
    }

    public function testWithoutDateFilterStaysPaginated(): void
    {
        $uuid = $this->seed();

        $this->client->request('GET', "/api/warehouses/$uuid/measurements");

        $this->assertResponseIsSuccessful();
        $body = json_decode($this->client->getResponse()->getContent(), true);
        // Default pagination still caps the payload at 200.
        $this->assertLessThanOrEqual(200, count($body['data']));
        $this->assertSame(self::SEEDED, $body['pagination']['total']);
        $this->assertGreaterThan(1, $body['pagination']['pages']);
    }

    private function seed(): string
    {
        /** @var EntityManagerInterface $em */
        $em = static::getContainer()->get(EntityManagerInterface::class);

        $pays = (new Pays())->setNom('Équateur')->setCodeIso('ECU');
        $em->persist($pays);

        $entrepot = (new Entrepot())
            ->setUuid(Uuid::v4())
            ->setNom('Entrepôt Test')
            ->setNumeroRue(1)
            ->setAdresse('a')
            ->setCodePostal(1)
            ->setVille('v')
            ->setPays($pays);
        $em->persist($entrepot);

        $now = new \DateTimeImmutable();
        for ($i = 0; $i < self::SEEDED; ++$i) {
            $at = $now->sub(new \DateInterval("PT{$i}S"));
            $em->persist((new Mesure())
                ->setUuid(Uuid::v4())
                ->setEntrepot($entrepot)
                ->setTemperature(24.0)
                ->setHumidite(52.0)
                ->setMesureLe($at)
                ->setSyncedAt($at));
        }
        $em->flush();

        return (string) $entrepot->getUuid();
    }
}
