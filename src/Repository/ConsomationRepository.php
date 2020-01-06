<?php

namespace App\Repository;

use App\Entity\Consomation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Persistence\ManagerRegistry;

/**
 * @method Consomation|null find($id, $lockMode = null, $lockVersion = null)
 * @method Consomation|null findOneBy(array $criteria, array $orderBy = null)
 * @method Consomation[]    findAll()
 * @method Consomation[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ConsomationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Consomation::class);
    }

    // /**
    //  * @return Consomation[] Returns an array of Consomation objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('c.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?Consomation
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
