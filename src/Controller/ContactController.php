<?php

namespace App\Controller;

use App\Form\ContactType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;


    /*public function contact(Request $request,\Swift_Mailer $mailer)
    {

        $form = $this ->createForm(ContactType::class);

       
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $data = $form->getData();

           

            $message = (new \Swift_Message('Hello Email'))
            
            ->setFrom($data['email'])
            -->setTo('contact@prosumers.tn')
            ->setBody($data['message']);

            /*$message = \Swift_Message::newInstance()
                ->setSubject('Demande de support')
                ->setFrom($data['email'])
                ->setTo('contact@prosumers.tn')
                ->setBody($data['message']);*/
        
           /*     $mailer->send($message);

                return $this->redirectToRoute('contact');
        }
        

        return $this->render('contact/index.html.twig', [
            'form' => $form->createView()
        ]);
    }
}*/

class ContactController extends AbstractController
{
    /**
     * @Route("/contact", name="contact")
     */

public function contact(Request $request,\Swift_Mailer $mailer)
{
    $form = $this->createForm(ContactType::class);

    $form->handleRequest($request);

    if ($form->isSubmitted() && $form->isValid()) {

        $data = $form->getData();

          $message = (new \Swift_Message('Support Prosumers'))
              ->setFrom($data['email'])
              ->setTo('contact@prosumers.tn')
              ->setBody(
                $data['message']
               )
           ;

          $mailer->send($message);

           return $this->redirectToRoute('contact');
    }

    return $this->render('contact/index.html.twig', [
        'form' => $form->createView(),
    ]);
}
}