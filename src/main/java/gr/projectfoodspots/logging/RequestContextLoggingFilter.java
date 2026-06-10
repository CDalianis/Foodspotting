package gr.projectfoodspots.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestContextLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            MDC.put("requestId", UUID.randomUUID().toString());
            MDC.put("method", request.getMethod());
            MDC.put("path", request.getRequestURI());
            MDC.put("ip", request.getRemoteAddr());

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = "anonymous";
            if (authentication != null && authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
                username = userDetails.getUsername();
            } else if (authentication != null && authentication.getName() != null) {
                username = authentication.getName();
            }
            MDC.put("username", username);

            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
