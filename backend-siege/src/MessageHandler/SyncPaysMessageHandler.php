<?php

namespace App\MessageHandler;

use App\Message\SyncPaysMessage;
use App\Repository\PaysRepository;
use App\Service\Sync\SyncService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
class SyncPaysMessageHandler
{
    public function __construct(
        private readonly SyncService    $syncService,
        private readonly PaysRepository $paysRepository,
    ) {
    }

    public function __invoke(SyncPaysMessage $message): void
    {
        $pays = $this->paysRepository->find($message->code);
        if ($pays === null || $pays->getApiUrl() === null) {
            return;
        }

        $this->syncService->syncPays($pays);
    }
}
