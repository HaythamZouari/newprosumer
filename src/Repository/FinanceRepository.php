<?php

namespace App\Repository;

use App\Entity\Finance;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Persistence\ManagerRegistry;

/**
 * @method Finance|null find($id, $lockMode = null, $lockVersion = null)
 * @method Finance|null findOneBy(array $criteria, array $orderBy = null)
 * @method Finance[]    findAll()
 * @method Finance[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class FinanceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Finance::class);
    }

    // /**
    //  * @return Finance[] Returns an array of Finance objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('f')
            ->andWhere('f.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('f.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?Finance
    {
        return $this->createQueryBuilder('f')
            ->andWhere('f.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
