<?php

namespace App\Repository;

use App\Entity\Pvgis;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Persistence\ManagerRegistry;

/**
 * @method Pvgis|null find($id, $lockMode = null, $lockVersion = null)
 * @method Pvgis|null findOneBy(array $criteria, array $orderBy = null)
 * @method Pvgis[]    findAll()
 * @method Pvgis[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PvgisRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pvgis::class);
    }

    // /**
    //  * @return Pvgis[] Returns an array of Pvgis objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('p.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?Pvgis
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
