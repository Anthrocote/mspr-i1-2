<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AlerteControllerTest extends WebTestCase
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

    public function testListWithoutTokenReturns401(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/alerts');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testListWithTokenReturns200(): void
    {
        $client = static::createClient();
        $token = $this->getToken();

        $client->request('GET', '/api/alerts', [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]);

        $this->assertResponseStatusCodeSame(200);
        $this->assertIsArray(json_decode($client->getResponse()->getContent(), true));
    }

    public function testListFilterByTypeReturns200(): void
    {
        $client = static::createClient();
        $token = $this->getToken();

        $client->request(
            'GET',
            '/api/alerts?type=out_of_range',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $this->assertResponseStatusCodeSame(200);
    }

    public function testResolveNonExistentAlerteReturns404(): void
    {
        $client = static::createClient();
        $token = $this->getToken();

        $client->request(
            'PATCH',
            '/api/alerts/00000000-0000-0000-0000-000000000000/resolve',
            [],
            [],
            ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]
        );

        $this->assertResponseStatusCodeSame(404);
    }
}
