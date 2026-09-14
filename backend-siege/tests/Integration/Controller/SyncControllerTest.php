<?php

namespace App\Tests\Integration\Controller;

class SyncControllerTest extends ApiTestCase
{
    public function testStatusReturns200(): void
    {
        $this->client->request('GET', '/api/sync/status');

        $this->assertResponseStatusCodeSame(200);
        $this->assertIsArray(json_decode($this->client->getResponse()->getContent(), true));
    }

    public function testSyncNonExistentPaysReturns404(): void
    {
        $this->client->request('POST', '/api/sync/countries/9999');

        $this->assertResponseStatusCodeSame(404);
    }
}
