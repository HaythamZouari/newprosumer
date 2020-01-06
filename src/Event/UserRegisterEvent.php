<?php


namespace App\Event;



use App\Entity\User;
use Symfony\Component\EventDispatcher\Event;

class UserRegisterEvent extends Event
{
    const NAME = 'user.register';
    /**
     * @var User
     */
    private $registeredUser;

    /**
     * @return User
     */
    public function getRegisteredUser(): User
    {
        return $this->registeredUser;
    }

    /**
     * UserRegisterEvent constructor.
     * @param User $registeredUser
     */
    public function __construct(User $registeredUser)
    {

        $this->registeredUser = $registeredUser;
    }
}