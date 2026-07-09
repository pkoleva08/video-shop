package com.videoshop.backend.queue;


import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;



@Service
public class QueueService {


    private final ConcurrentLinkedQueue<WaitingCustomer> waitingCustomers =
            new ConcurrentLinkedQueue<>();



    public WaitingCustomer join(
            String sessionId,
            String source
    ) {

        WaitingCustomer customer =
                new WaitingCustomer(
                        sessionId,
                        source
                );


        waitingCustomers.add(customer);


        return customer;
    }



    public boolean removeCustomer(
            String sessionId
    ) {

        return waitingCustomers.removeIf(
                customer ->
                        customer.getSessionId()
                                .equals(sessionId)
        );
    }




    public WaitingCustomer getNextCustomer() {


        WaitingCustomer customer =
                waitingCustomers.poll();


        if (customer != null) {

            customer.assign();

        }


        return customer;
    }





    public List<WaitingCustomer> getWaitingCustomers() {

        return new ArrayList<>(
                waitingCustomers
        );
    }





    public int getSize() {

        return waitingCustomers.size();
    }

}