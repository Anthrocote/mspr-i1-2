<?php

namespace App\Repository;

use App\Entity\Produit;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ProduitRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Produit::class);
    }

    /** @return array{items: list<Produit>, total: int} */
    public function findPaginated(int $limit, int $offset): array
    {
        return [
            'items' => $this->findBy([], ['nom' => 'ASC'], $limit, $offset),
            'total' => $this->count([]),
        ];
    }
}
