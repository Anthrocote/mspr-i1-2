<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Browser CORS for the read API consumed by the siège frontend (a separate
 * origin in dev). Preflight OPTIONS requests are answered here before routing.
 * The allowed origin is CORS_ALLOW_ORIGIN; unset means "reflect the caller's
 * Origin", which is convenient in dev. Set it to a fixed origin in production.
 */
class CorsSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onRequest', 9999],
            KernelEvents::RESPONSE => ['onResponse', -9999],
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest() || $event->getRequest()->getMethod() !== 'OPTIONS') {
            return;
        }

        // Short-circuit the preflight: no controller runs for an OPTIONS probe.
        $response = new Response('', Response::HTTP_NO_CONTENT);
        $this->applyCors($response, $event->getRequest()->headers->get('Origin'));
        $event->setResponse($response);
    }

    public function onResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $this->applyCors($event->getResponse(), $event->getRequest()->headers->get('Origin'));
    }

    private function applyCors(Response $response, ?string $origin): void
    {
        $configured = $_ENV['CORS_ALLOW_ORIGIN'] ?? $_SERVER['CORS_ALLOW_ORIGIN'] ?? '*';
        $allowOrigin = $configured === '*' ? ($origin ?? '*') : $configured;

        $response->headers->set('Access-Control-Allow-Origin', $allowOrigin);
        $response->headers->set('Vary', 'Origin');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY, Authorization');
        $response->headers->set('Access-Control-Max-Age', '3600');
    }
}
