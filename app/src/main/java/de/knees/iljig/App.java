
package de.knees.iljig;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
class App {
    String getGreeting() {
        return "Hello World!";
    }

    static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
