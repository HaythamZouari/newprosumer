<?php

namespace App\Repository;

use App\Entity\Pvwatt;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Persistence\ManagerRegistry;

/**
 * @method Pvwatt|null find($id, $lockMode = null, $lockVersion = null)
 * @method Pvwatt|null findOneBy(array $criteria, array $orderBy = null)
 * @method Pvwatt[]    findAll()
 * @method Pvwatt[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PvwattRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pvwatt::class);
    }

    // /**
    //  * @return Pvwatt[] Returns an array of Pvwatt objects
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
    public function findOneBySomeField($value): ?Pvwatt
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
