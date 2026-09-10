<?php

namespace App\Message;

/** Déclenche la synchronisation d'un pays donné par son ID. */
final class SyncPaysMessage
{
    public function __construct(public readonly int $paysId)
    {
    }
}
