<?php

namespace App\Pagination;

use Doctrine\ORM\QueryBuilder;
use Doctrine\ORM\Tools\Pagination\Paginator;

final class QueryPaginator
{
    /**
     * Apply limit/offset to a query builder and return the page plus the total count.
     * $fetchJoinCollection must be true when the query fetch-joins a to-many association,
     * so the count and the LIMIT stay correct instead of counting joined rows.
     *
     * @return array{items: list<object>, total: int}
     */
    public static function paginate(QueryBuilder $qb, int $limit, int $offset, bool $fetchJoinCollection = false): array
    {
        $query = $qb->getQuery()
            ->setFirstResult($offset)
            ->setMaxResults($limit);

        $paginator = new Paginator($query, fetchJoinCollection: $fetchJoinCollection);

        return [
            'items' => array_values(iterator_to_array($paginator)),
            'total' => count($paginator),
        ];
    }
}
