<?php

namespace App\Pagination;

use Symfony\Component\HttpFoundation\Request;

/**
 * Offset/limit pagination read from a request, with hard bounds so a list
 * endpoint can never return an unbounded payload.
 */
final class Pagination
{
    private function __construct(
        private readonly int $page,
        private readonly int $limit,
    ) {
    }

    public static function fromRequest(Request $request, int $defaultLimit = 50, int $maxLimit = 200): self
    {
        $page = (int) $request->query->get('page', 1);
        $page = max(1, $page);

        $limit = (int) $request->query->get('limit', $defaultLimit);
        if ($limit < 1) {
            $limit = $defaultLimit;
        }
        $limit = min($limit, $maxLimit);

        return new self($page, $limit);
    }

    public function getPage(): int
    {
        return $this->page;
    }

    public function getLimit(): int
    {
        return $this->limit;
    }

    public function getOffset(): int
    {
        return ($this->page - 1) * $this->limit;
    }

    /**
     * @param list<mixed> $data
     *
     * @return array{data: list<mixed>, pagination: array{page: int, limit: int, total: int, pages: int}}
     */
    public function envelope(array $data, int $total): array
    {
        return [
            'data'       => $data,
            'pagination' => [
                'page'  => $this->page,
                'limit' => $this->limit,
                'total' => $total,
                'pages' => (int) ceil($total / $this->limit),
            ],
        ];
    }
}
