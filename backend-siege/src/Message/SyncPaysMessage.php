<?php

namespace App\Message;

/** Déclenche la synchronisation d'un pays donné par son code ISO. */
final class SyncPaysMessage
{
    public function __construct(public readonly string $code)
    {
    }
}
