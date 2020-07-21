![](images/Screen%20Shot%202020-07-20%20at%206.22.11%20PM.png)

# Distant Spaces


DNA Spaces and Cisco Webex Teams to help with social distancing in workplace enviroments.

## Business/Technical Challenge


As the rise of social distancing practices comes to professional workplace environments, employees are becoming more aware of proper practices that will reduce the spread of COVID19. In particular, certain areas in the office such as cafeterias were often used with no regard to social distancing rules.

## Proposed Solution


As such, Distant Spaces is a solution that tackles this issue by connecting to the office wireless system, based on catalyst 9k or Meraki APs, tow webex teams bot to allow employees to query the bot before entering an area to check if it's safe to enter or not. This will require mapping of the office floor and devices to be connected to the corporate network. For example, before entering the floor where the cafeteria is located, an employee can query the bot and retrieve the following information: 

- Status of the floor (Safe, busy, very busy) based on client count
- Sanitization station location (masks, hand sanitizer)
- Office Admin contact info/ start a conversation

### Cisco Products Technologies/ Services


Our solution will levegerage the following Cisco technologies

* [DNA Spaces](https://dnaspaces.cisco.com/)
* [Webex Teams](https://www.webex.com/team-collaboration.html)
* [Cisco Meraki](https://meraki.cisco.com/)

## Team Members


* Yachie Xu <yacxu@cisco.com> - Global Virtual Engnieering
* Nour Zourob <nozourob@cisco.com> - Commercial Systems Engineer
* *Special thank you to Kelvin Cui - Technical Intern, for assisting in the project

## Solution Components


<!-- This does not need to be completed during the initial submission phase  

Provide a brief overview of the components involved with this project. e.g Python /  -->

![](images/Screen%20Shot%202020-07-20%20at%206.38.19%20PM.png)

## Usage

<!-- This does not need to be completed during the initial submission phase  

Provide a brief overview of how to use the solution  -->

![](images/Screen%20Shot%202020-07-20%20at%206.46.03%20PM.png)
![](images/Screen%20Shot%202020-07-20%20at%206.46.09%20PM.png)


## Installation

How to install or setup the project for use.

1. Node & npm (minimum tested version is node 8.0.0 or higher) and git installed on your machine

2. Set up webex account and create a new bot

3. Clone this repository 
   git clone https://github.com/YachieXu/distant-spaces.git

4.Configure config.json file in the code directory with Webex Bot Token
   "token": “Bot Token”

5. Finally, to install and start the application, run this command:
  $ npm start

## Documentation

Pointer to reference documentation for this project.


## License

Provided under Cisco Sample Code License, for details see [LICENSE](./LICENSE.md)

## Code of Conduct

Our code of conduct is available [here](./CODE_OF_CONDUCT.md)

## Contributing

See our contributing guidelines [here](./CONTRIBUTING.md)
