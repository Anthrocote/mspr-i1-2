<?php

namespace App\Tests\Integration\Controller;

class LotControllerTest extends ApiTestCase
{
    public function testListReturns200(): void
    {
        $this->client->request('GET', '/api/lots');

        $this->assertResponseStatusCodeSame(200);
        $this->assertIsArray(json_decode($this->client->getResponse()->getContent(), true));
    }

    public function testListFilterByStatusReturns200(): void
    {
        $this->client->request('GET', '/api/lots?status=compliant');

        $this->assertResponseStatusCodeSame(200);
    }

    public function testShowNonExistentLotReturns404(): void
    {
        $this->client->request('GET', '/api/lots/00000000-0000-0000-0000-000000000000');

        $this->assertResponseStatusCodeSame(404);
    }
}
