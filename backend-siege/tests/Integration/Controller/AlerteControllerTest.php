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
}
