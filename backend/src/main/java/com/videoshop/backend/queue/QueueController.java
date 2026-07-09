package com.videoshop.backend.queue;


import org.springframework.web.bind.annotation.*;

import java.util.List;



@RestController
@RequestMapping("/queue")
@CrossOrigin
public class QueueController {


    private final QueueService queueService;



    public QueueController(
            QueueService queueService
    ) {

        this.queueService = queueService;
    }





    @PostMapping("/join")
    public WaitingCustomer join(
            @RequestParam String sessionId,
            @RequestParam(defaultValue = "customer-page") String source
    ) {


        return queueService.join(
                sessionId,
                source
        );
    }






    @DeleteMapping("/leave")
    public void leave(
            @RequestParam String sessionId
    ) {


        queueService.removeCustomer(
                sessionId
        );
    }






    @GetMapping("/list")
    public List<WaitingCustomer> getQueue() {


        return queueService.getWaitingCustomers();

    }






    @GetMapping("/size")
    public int getSize() {


        return queueService.getSize();

    }

}