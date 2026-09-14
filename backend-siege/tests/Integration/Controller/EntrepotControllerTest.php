<?php

namespace App\Tests\Integration\Controller;

class EntrepotControllerTest extends ApiTestCase
{
    public function testListReturns200(): void
    {
        $this->client->request('GET', '/api/warehouses');

        $this->assertResponseStatusCodeSame(200);
        $this->assertIsArray(json_decode($this->client->getResponse()->getContent(), true));
    }

    public function testListFilterByCountryReturns200(): void
    {
        $this->client->request('GET', '/api/warehouses?country_id=1');

        $this->assertResponseStatusCodeSame(200);
    }

    public function testShowNonExistentEntrepotReturns404(): void
    {
        $this->client->request('GET', '/api/warehouses/00000000-0000-0000-0000-000000000000');

        $this->assertResponseStatusCodeSame(404);
    }
}
