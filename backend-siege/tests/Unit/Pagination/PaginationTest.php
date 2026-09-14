<?php

namespace App\Tests\Unit\Pagination;

use App\Pagination\Pagination;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

class PaginationTest extends TestCase
{
    private function request(array $query): Request
    {
        return new Request($query);
    }

    public function testDefaults(): void
    {
        $p = Pagination::fromRequest($this->request([]));

        $this->assertSame(1, $p->getPage());
        $this->assertSame(50, $p->getLimit());
        $this->assertSame(0, $p->getOffset());
    }

    public function testOffsetIsComputedFromPage(): void
    {
        $p = Pagination::fromRequest($this->request(['page' => 3, 'limit' => 20]));

        $this->assertSame(3, $p->getPage());
        $this->assertSame(20, $p->getLimit());
        $this->assertSame(40, $p->getOffset());
    }

    public function testLimitIsCappedAtMax(): void
    {
        $p = Pagination::fromRequest($this->request(['limit' => 10000]));

        $this->assertSame(200, $p->getLimit());
    }

    public function testInvalidValuesFallBackToSafeDefaults(): void
    {
        $p = Pagination::fromRequest($this->request(['page' => -5, 'limit' => 0]));

        $this->assertSame(1, $p->getPage());
        $this->assertSame(50, $p->getLimit());
    }

    public function testEnvelopeComputesPageCount(): void
    {
        $p = Pagination::fromRequest($this->request(['page' => 1, 'limit' => 20]));

        $envelope = $p->envelope(['a', 'b'], 45);

        $this->assertSame(['a', 'b'], $envelope['data']);
        $this->assertSame(20, $envelope['pagination']['limit']);
        $this->assertSame(45, $envelope['pagination']['total']);
        $this->assertSame(3, $envelope['pagination']['pages']);
    }

    public function testEnvelopeWithNoResults(): void
    {
        $p = Pagination::fromRequest($this->request([]));

        $envelope = $p->envelope([], 0);

        $this->assertSame([], $envelope['data']);
        $this->assertSame(0, $envelope['pagination']['total']);
        $this->assertSame(0, $envelope['pagination']['pages']);
    }
}
