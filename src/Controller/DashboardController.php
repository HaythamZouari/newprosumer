<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;

class DashboardController extends AbstractController
{
    /**
     * @Route("/" , name="dashboard",methods={"GET","POST"})
     */
    public function index()
    {
        return $this->render('base.html.twig');
    }
}
