<?php

namespace App\Repository;

use App\Entity\Pays;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PaysRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pays::class);
    }

    /** @return array{items: list<Pays>, total: int} */
    public function findPaginated(int $limit, int $offset): array
    {
        return [
            'items' => $this->findBy([], ['id' => 'ASC'], $limit, $offset),
            'total' => $this->count([]),
        ];
    }
}
