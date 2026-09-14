<?php

namespace App\Tests\Integration\Controller;

class PaysControllerTest extends ApiTestCase
{
    public function testListReturns200(): void
    {
        $this->client->request('GET', '/api/countries');

        $this->assertResponseStatusCodeSame(200);
        $this->assertIsArray(json_decode($this->client->getResponse()->getContent(), true));
    }

    public function testShowNonExistentPaysReturns404(): void
    {
        $this->client->request('GET', '/api/countries/9999');

        $this->assertResponseStatusCodeSame(404);
    }
}
