<?php

namespace App\MessageHandler;

use App\Message\SyncAllPaysMessage;
use App\Service\Sync\SyncService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
class SyncAllPaysMessageHandler
{
    public function __construct(private readonly SyncService $syncService)
    {
    }

    public function __invoke(SyncAllPaysMessage $message): void
    {
        $this->syncService->syncAll();
    }
}
