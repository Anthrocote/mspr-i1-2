<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class SyncControllerTest extends WebTestCase
{
    private function getToken(): string
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'admin@futurekawa.com', 'password' => 'admin1234'])
        );
        return json_decode($client->getResponse()->getContent(), true)['token'] ?? '';
    }

    public function testStatusWithoutTokenReturns401(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/sync/status');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testStatusWithTokenReturns200(): void
    {
        $client = static::createClient();
        $token = $this->getToken();

        $client->request('GET', '/api/sync/status', [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]);

        $this->assertResponseStatusCodeSame(200);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }

    public function testSyncNonExistentPaysReturns404(): void
    {
        $client = static::createClient();
        $token = $this->getToken();

        $client->request(
            'POST',
            '/api/sync/pays/9999',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $this->assertResponseStatusCodeSame(404);
    }
}
