<?php


namespace App\Mailer;


use App\Entity\User;

class Mailer
{
    /**
     * @var \Swift_Mailer
     */
    private $mailer;
    /**
     * @var \Twig_Environment
     */
    private $twig;
    /**
     * @var string
     */
    private $mailFrom;

    public function __construct(\Swift_Mailer $mailer, \Twig_Environment $twig,string $mailFrom)
    {
        $this->twig=$twig;
        $this->mailer=$mailer;
        $this->mailFrom = $mailFrom;
    }
    public  function sendConfirmationEmail(User $user){
        $message =(new \Swift_Message())
            ->setSubject('Welcome to the app!')
            ->setFrom($this->mailFrom)
            ->setTo($user->getEmail())
            ->setBody($this->twig->render('email/registration.html.twig',['user'=>$user]),'text/html');
        $this->mailer->send($message);
    }
}