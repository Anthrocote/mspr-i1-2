<?php

namespace App\Tests\Integration\Controller;

class AlerteControllerTest extends ApiTestCase
{
    public function testListReturns200(): void
    {
        $this->client->request('GET', '/api/alerts');

        $this->assertResponseStatusCodeSame(200);
        $this->assertIsArray(json_decode($this->client->getResponse()->getContent(), true));
    }

    public function testListFilterByTypeReturns200(): void
    {
        $this->client->request('GET', '/api/alerts?type=out_of_range');

        $this->assertResponseStatusCodeSame(200);
    }

    public function testResolveNonExistentAlerteReturns404(): void
    {
        $this->client->request('PATCH', '/api/alerts/00000000-0000-0000-0000-000000000000/resolve');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testListDefaultReturnsOnlyActiveAlerts(): void
    {
        $this->seedAlert('out_of_range', new \DateTimeImmutable('-1 hour'), null);
        $this->seedAlert('sensor_offline', new \DateTimeImmutable('-3 hours'), new \DateTimeImmutable('-2 hours'));

        $this->client->request('GET', '/api/alerts');
        $this->assertResponseIsSuccessful();
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame(1, $body['pagination']['total']);
        foreach ($body['data'] as $alert) {
            $this->assertNull($alert['resolvedAt'], 'the default list must expose only active alerts');
        }
    }

    public function testListStatusResolvedReturnsOnlyResolvedAlerts(): void
    {
        $this->seedAlert('out_of_range', new \DateTimeImmutable('-1 hour'), null);
        $this->seedAlert('sensor_offline', new \DateTimeImmutable('-3 hours'), new \DateTimeImmutable('-2 hours'));

        $this->client->request('GET', '/api/alerts?status=resolved');
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true)['data'];
        $this->assertNotEmpty($data);
        foreach ($data as $alert) {
            $this->assertNotNull($alert['resolvedAt'], 'the resolved list must expose only resolved alerts');
        }
    }

    public function testListStatusAllIncludesResolvedAndActive(): void
    {
        $this->seedAlert('out_of_range', new \DateTimeImmutable('-1 hour'), null);
        $this->seedAlert('sensor_offline', new \DateTimeImmutable('-3 hours'), new \DateTimeImmutable('-2 hours'));

        $this->client->request('GET', '/api/alerts?status=active');
        $activeTotal = json_decode($this->client->getResponse()->getContent(), true)['pagination']['total'];

        $this->client->request('GET', '/api/alerts?status=all');
        $allTotal = json_decode($this->client->getResponse()->getContent(), true)['pagination']['total'];

        $this->assertSame(1, $activeTotal);
        $this->assertSame(2, $allTotal, 'status=all must include the resolved alert on top of the active one');
    }

    public function testListDateRangeFiltersByTriggeredAt(): void
    {
        $this->seedAlert('out_of_range', new \DateTimeImmutable('-1 hour'), null);
        $this->seedAlert('sensor_offline', new \DateTimeImmutable('-10 days'), null);

        // Only alerts triggered within the last day.
        $from = (new \DateTimeImmutable('-1 day'))->format(\DateTimeInterface::ATOM);
        $this->client->request('GET', '/api/alerts?status=all&from=' . urlencode($from));
        $this->assertResponseIsSuccessful();
        $total = json_decode($this->client->getResponse()->getContent(), true)['pagination']['total'];
        $this->assertSame(1, $total, 'the 10-day-old alert must fall outside the from bound');
    }

    private function seedAlert(string $type, \DateTimeImmutable $triggeredAt, ?\DateTimeImmutable $resolvedAt): void
    {
        $em = static::getContainer()->get(\Doctrine\ORM\EntityManagerInterface::class);
        $alerte = (new \App\Entity\Alerte())
            ->setUuid(\Symfony\Component\Uid\Uuid::v4())
            ->setType($type)
            ->setDeclencheeLe($triggeredAt)
            ->setResolueLe($resolvedAt);
        $em->persist($alerte);
        $em->flush();
    }
}
